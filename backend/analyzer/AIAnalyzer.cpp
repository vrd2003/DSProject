#include "AIAnalyzer.h"
#include <fstream>
#include <cstdlib>
#include <cstdio>
#include <iostream>

// Helper to safely get string from crow::json::rvalue (converts numbers to strings automatically)
inline std::string get_string(const crow::json::rvalue& val, const std::string& key, const std::string& fallback = "") {
    if (!val.has(key)) return fallback;
    if (val[key].t() == crow::json::type::String) {
        return std::string(val[key].s());
    }
    if (val[key].t() == crow::json::type::Number) {
        return std::to_string(val[key].i());
    }
    return fallback;
}

// Helper to safely get int from crow::json::rvalue (handles strings too)
inline int get_int(const crow::json::rvalue& val, const std::string& key, int fallback = 0) {
    if (!val.has(key)) return fallback;
    if (val[key].t() == crow::json::type::Number) {
        return val[key].i();
    }
    if (val[key].t() == crow::json::type::String) {
        try {
            return std::stoi(std::string(val[key].s()));
        } catch (...) {
            return fallback;
        }
    }
    return fallback;
}

crow::json::wvalue AIAnalyzer::fetchAISuggestions(const std::string& code) {

    crow::json::wvalue req;
    req["model"] = "meta-llama/llama-4-scout-17b-16e-instruct";
    req["max_tokens"] = 8192;
    req["temperature"] = 0.1;
    
    // 1. DATA STRUCTURE SPECIFIC EXPERT PROMPTS
    std::string ds_specs = "";
    std::string pattern = "default";
    
    if (code.find("arr") != std::string::npos || code.find("Array") != std::string::npos || code.find("array") != std::string::npos || code.find("vector") != std::string::npos) {
        pattern = "array";
        ds_specs = "--- ARRAY EXPERT MODE ---\n"
                   "- Each physical array element MUST have an 'index' property.\n"
                   "- During SHIFTING (insert/delete), focus on showing the movement. Explain: 'Moving element from index X to X+1'.\n"
                   "- The 'active_node_id' should point to the element currently being modified.\n";
    } else if (code.find("Trie") != std::string::npos || code.find("trie") != std::string::npos) {
        pattern = "trie";
        ds_specs = "--- TRIE EXPERT MODE ---\n"
                   "- Each node MUST have a 'children' object/map (not always a list).\n"
                   "- Edges are labeled with a 'char' property.\n"
                   "- Leaf nodes that complete a word must have 'isEndOfWord': true and 'word': 'the_word'.\n"
                   "- Layout: Strictly hierarchical TB.\n";
    } else if (code.find("RedBlack") != std::string::npos || code.find("red-black") != std::string::npos || code.find("RBT") != std::string::npos) {
        pattern = "tree";
        ds_specs = "--- RED-BLACK TREE EXPERT MODE ---\n"
                   "- Every node MUST have a 'color' property ('red' or 'black').\n"
                   "- Focus heavily on ROTATIONS. When a rotation occurs, explain it clearly in the 'description'.\n"
                   "- Use 'left' and 'right' pointers. Omit NIL/Sentinel nodes unless they change color.\n";
    } else if (code.find("Tree") != std::string::npos || code.find("tree") != std::string::npos || code.find("Node") != std::string::npos) {
        pattern = "tree";
        ds_specs = "--- BINARY TREE EXPERT MODE ---\n"
                   "- Every node MUST use 'left' and 'right' child IDs.\n"
                   "- Do NOT use 'next'. Use 'left' and 'right' for all branches.\n"
                   "- Layout: High-width hierarchical TB.\n";
    } else if (code.find("Stack") != std::string::npos || code.find("stack") != std::string::npos) {
        pattern = "stack";
        ds_specs = "--- STACK EXPERT MODE ---\n"
                   "- Use a vertical array-like layout.\n"
                   "- The top-most element MUST have metadata 'TOP'.\n"
                   "- Layout: Strictly vertical TB (Bucket model).\n";
    } else if (code.find("List") != std::string::npos || code.find("list") != std::string::npos) {
        pattern = "list";
        ds_specs = "--- LINKED LIST EXPERT MODE ---\n"
                   "- Use 'next' pointers. The last node 'next' is 'null'.\n"
                   "- Layout: Strictly horizontal LR.\n";
    } else {
        ds_specs = "--- GENERIC STRUCTURE MODE ---\n"
                   "- Detect the pattern and maintain logical connectivity.\n";
    }

    std::string global_constraints = "--- GLOBAL CONSTRAINTS ---\n"
                                     "- PRECISION & BREVITY: Do NOT generate redundant loop steps. Skip iterations if state doesn't change meaningfully.\n"
                                     "- Focus ONLY on critical state changes (insertions, deletions, swaps).\n"
                                     "- Target 5-15 high-quality steps per algorithm.\n"
                                     "- NEVER generate 'NULL' or 'Sentinel' nodes.\n";

    std::string prompt = "You are an ELITE COMPUTER SCIENCE ALGORITHM VISUALIZER. "
        "Your mission is to generate a PERFECT frame-by-frame simulation of the provided code.\n\n"
        + ds_specs + global_constraints + 
        "\n--- OUTPUT FORMAT ---\n"
        "detected_pattern: " + pattern + "\n"
        "JSON ONLY (MINIFIED): "
        "{ \"algorithm_name\": \"\", \"view_type\": \"hierarchical|linear\", \"detected_pattern\": \"" + pattern + "\", \"description\": \"\", "
        "\"overall_time_complexity\": \"\", \"overall_space_complexity\": \"\", \"bottlenecks\": [\"\"], \"edge_cases\": [\"\"], "
        "\"functions\": [ {\"name\": \"\", \"time_complexity\": \"\", \"space_complexity\": \"\"} ], \"suggestions\": [], "
        "\"graph_states\": [ { \"step\": 1, \"action\": \"\", \"description\": \"\", \"active_node_id\": \"\", \"variables\": {}, "
        "\"nodes\": [ { \"id\": \"\", \"val\": \"\", \"color\": \"\", \"shape\": \"\", \"left\": \"\", \"right\": \"\", \"threadLeft\": false, \"threadRight\": false, \"metadata\": \"\", \"children\": {} } ] } ] }"
        "\n\nSource Code:\n\n" + code;
        
    req["messages"][0]["role"] = "user";
    req["messages"][0]["content"] = prompt;
    
    // Write request to temp file safely to avoid OS cmdline character limits
    std::ofstream outReq("groq_req.json");
    if (outReq.is_open()) {
        outReq << req.dump();
        outReq.close();
    } else {
        std::cerr << "Failed to open groq_req.json for writing." << std::endl;
    }
    
    // Call Groq API via curl synchronously
    std::cerr << "[DEBUG] Sending request to Groq API (Timeout: 60s)..." << std::endl;
    std::string apiKey = "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";
    std::string cmd = "curl.exe -s --max-time 60 -w \"\\n%{http_code}\" -X POST https://api.groq.com/openai/v1/chat/completions "
                      "-H \"Authorization: Bearer " + apiKey + "\" "
                      "-H \"Content-Type: application/json\" "
                      "-d @groq_req.json -o groq_res.json";
                      
    int rc = system(cmd.c_str());
    if (rc != 0) {
        std::cerr << "[ERROR] Groq API call failed. Exit code: " << rc << std::endl;
        return fallbackAISuggestions();
    }
    
    // Check if output file exists
    std::ifstream checkFile("groq_res.json");
    if (!checkFile.good()) {
        std::cerr << "[ERROR] Groq response file not found." << std::endl;
        return fallbackAISuggestions();
    }
    checkFile.close();
    
    // Read JSON response
    std::ifstream inRes("groq_res.json");
    std::string responseStr((std::istreambuf_iterator<char>(inRes)), std::istreambuf_iterator<char>());
    inRes.close();
    
    // Cleanup temporary files disabled for debugging
    // std::remove("groq_req.json");
    // std::remove("groq_res.json");
    
    std::cerr << "[DEBUG] AI Response Received (" << responseStr.length() << " bytes)." << std::endl;
    
    auto parsedResponse = crow::json::load(responseStr);
    
    if (parsedResponse && parsedResponse.has("choices") && parsedResponse["choices"].t() == crow::json::type::List && parsedResponse["choices"].size() > 0) {
        auto& firstChoice = parsedResponse["choices"][0];
        if (!firstChoice.has("message") || firstChoice["message"].t() != crow::json::type::Object) return fallbackAISuggestions();
        
        std::string aiContent = get_string(firstChoice["message"], "content", "");
        
        // Extract JSON block if LLM included conversational text
        size_t firstBrace = aiContent.find('{');
        size_t lastBrace = aiContent.rfind('}');
        if (firstBrace != std::string::npos && lastBrace != std::string::npos && lastBrace > firstBrace) {
            aiContent = aiContent.substr(firstBrace, lastBrace - firstBrace + 1);
        }

        auto x = crow::json::load(aiContent);
        if (x) {
            std::cerr << "[DEBUG] Processing AI JSON Block: " << aiContent << std::endl;
            crow::json::wvalue ret;
            std::string errorMsg = x.has("error") ? std::string(x["error"].s()) : std::string("");
            ret["error"] = errorMsg;
            if (errorMsg != "") {
                std::cerr << "[AI LOGIC WARNING] AI says: " << errorMsg << std::endl;
                // DO NOT RETURN. We want to show the graph anyway.
                ret["status"] = "warning";
            }
            ret["algorithm_name"] = get_string(x, "algorithm_name", "Detected Algorithm");
            ret["view_type"] = get_string(x, "view_type", "hierarchical");
            ret["detected_pattern"] = get_string(x, "detected_pattern", "");
            ret["description"] = get_string(x, "description", "No description provided.");
            ret["overall_time_complexity"] = get_string(x, "overall_time_complexity", "Unknown");
            ret["overall_space_complexity"] = get_string(x, "overall_space_complexity", "Unknown");
            
            // Bottlenecks
            if (x.has("bottlenecks") && x["bottlenecks"].t() == crow::json::type::List) {
                for(size_t i=0; i<x["bottlenecks"].size(); ++i) {
                    if (x["bottlenecks"][i].t() == crow::json::type::String)
                        ret["bottlenecks"][i] = std::string(x["bottlenecks"][i].s());
                }
            } else {
                ret["bottlenecks"] = crow::json::wvalue::list();
            }

            // Edge Cases
            if (x.has("edge_cases") && x["edge_cases"].t() == crow::json::type::List) {
                for(size_t i=0; i<x["edge_cases"].size(); ++i) {
                    if (x["edge_cases"][i].t() == crow::json::type::String)
                        ret["edge_cases"][i] = std::string(x["edge_cases"][i].s());
                }
            } else {
                ret["edge_cases"] = crow::json::wvalue::list();
            }

            if (x.has("suggestions") && x["suggestions"].t() == crow::json::type::List) {
                for(size_t i=0; i<x["suggestions"].size(); ++i) {
                    if (x["suggestions"][i].t() == crow::json::type::String)
                        ret["suggestions"][i] = std::string(x["suggestions"][i].s());
                }
            } else {
                ret["suggestions"] = crow::json::wvalue::list();
            }
            
            if (x.has("functions") && x["functions"].t() == crow::json::type::List) {
                for(size_t i=0; i<x["functions"].size(); ++i) {
                    auto& f = x["functions"][i];
                    if (f.t() == crow::json::type::Object) {
                        ret["functions"][i]["name"] = get_string(f, "name", "unknown");
                        ret["functions"][i]["time_complexity"] = get_string(f, "time_complexity", "Unknown");
                        ret["functions"][i]["space_complexity"] = get_string(f, "space_complexity", "Unknown");
                    } else if (f.t() == crow::json::type::String) {
                        ret["functions"][i]["name"] = std::string(f.s());
                        ret["functions"][i]["time_complexity"] = "Unknown";
                        ret["functions"][i]["space_complexity"] = "Unknown";
                    }
                }
            } else {
                ret["functions"] = crow::json::wvalue::list();
            }
            
            if (x.has("graph_states") && x["graph_states"].t() == crow::json::type::List && x["graph_states"].size() > 0) {
                for (size_t i = 0; i < x["graph_states"].size(); ++i) {
                    auto& st = x["graph_states"][i];
                    ret["graph_states"][i]["step"] = get_int(st, "step", (int)i + 1);
                    ret["graph_states"][i]["action"] = get_string(st, "action", "Executing");
                    ret["graph_states"][i]["active_node_id"] = get_string(st, "active_node_id", "");
                    ret["graph_states"][i]["description"] = get_string(st, "description", "");
                    
                    if (st.has("variables") && st["variables"].t() == crow::json::type::Object) {
                        ret["graph_states"][i]["variables"] = st["variables"];
                    } else {
                        ret["graph_states"][i]["variables"] = crow::json::wvalue::list();
                    }
                    
                    if (st.has("nodes") && st["nodes"].t() == crow::json::type::List) {
                        for (size_t j = 0; j < st["nodes"].size(); ++j) {
                            auto& n = st["nodes"][j];
                            ret["graph_states"][i]["nodes"][j]["id"] = get_string(n, "id", "0");
                            ret["graph_states"][i]["nodes"][j]["val"] = get_string(n, "val", "0");
                            ret["graph_states"][i]["nodes"][j]["color"] = get_string(n, "color", "");
                            ret["graph_states"][i]["nodes"][j]["metadata"] = get_string(n, "metadata", "");
                            ret["graph_states"][i]["nodes"][j]["shape"] = get_string(n, "shape", "circle");
                            ret["graph_states"][i]["nodes"][j]["left"] = get_string(n, "left", "null");
                            ret["graph_states"][i]["nodes"][j]["right"] = get_string(n, "right", "null");
                            ret["graph_states"][i]["nodes"][j]["threadLeft"] = (n.has("threadLeft") && n["threadLeft"].t() == crow::json::type::True);
                            ret["graph_states"][i]["nodes"][j]["threadRight"] = (n.has("threadRight") && n["threadRight"].t() == crow::json::type::True);
                        }
                    } else {
                        ret["graph_states"][i]["nodes"] = crow::json::wvalue::list();
                    }
                }
            } else {
                // FALLBACK: Generate at least one node so the visualizer isn't empty.
                ret["graph_states"][0]["step"] = 1;
                ret["graph_states"][0]["description"] = "Simulation generated. View details in AI tab.";
                ret["graph_states"][0]["nodes"][0]["id"] = "start";
                ret["graph_states"][0]["nodes"][0]["val"] = 0;
                ret["graph_states"][0]["variables"] = crow::json::wvalue::list();
            }
            
            return ret;
        } else {
            std::cerr << "Failed to parse final AI internal json content: " << aiContent << std::endl;
        }
        if (parsedResponse && parsedResponse.has("error")) {
            std::cerr << "Groq API JSON Error: " << crow::json::wvalue(parsedResponse["error"]).dump() << std::endl;
        }
    } else {
        std::cerr << "FAILED: AI response was empty or not recognized as valid API response JSON." << std::endl;
        std::cerr << "--- DEBUG: RAW RESPONSE START ---\n" << responseStr.substr(0, 1000) << "\n--- DEBUG: RAW RESPONSE END ---" << std::endl;
        
        // Check for common API errors in raw text
        if (responseStr.find("rate_limit_exceeded") != std::string::npos) {
            std::cerr << "[CRITICAL] Groq Rate Limit Reached!" << std::endl;
        } else if (responseStr.find("invalid_api_key") != std::string::npos) {
            std::cerr << "[CRITICAL] Invalid Groq API Key!" << std::endl;
        }
    }
    
    return fallbackAISuggestions();
}

crow::json::wvalue AIAnalyzer::fallbackAISuggestions() {
    crow::json::wvalue fallback;
    fallback["error"] = "AI Analysis failed to generate.";
    fallback["algorithm_name"] = "Analysis Unavailable";
    fallback["description"] = "Failed to fetch AI suggestions. Please check if the backend can reach Groq API and if your API key is valid.";
    fallback["overall_time_complexity"] = "N/A";
    fallback["overall_space_complexity"] = "N/A";
    fallback["functions"] = crow::json::wvalue::list();
    fallback["suggestions"] = crow::json::wvalue::list();
    fallback["graph_states"] = crow::json::wvalue::list();
    return fallback;
}
