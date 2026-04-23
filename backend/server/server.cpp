#define ASIO_STANDALONE
#include "../crow_all.h"
#include "../parser/Tokenizer.h"
#include "../parser/Parser.h"
#include "../simulator/ExecutionEngine.h"
#include "../compiler/ASTtoJSON.h"
#include "../analyzer/AIAnalyzer.h"

void startServer() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/analyze").methods("OPTIONS"_method)
    ([](const crow::request& req) {
        auto res = crow::response(204);
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type");
        return res;
    });

    CROW_ROUTE(app, "/analyze").methods("POST"_method)
    ([](const crow::request& req) {
        crow::json::rvalue body;
        try {
            std::cerr << "[DEBUG] Loading JSON body. Bytes: " << req.body.size() << std::endl;
            body = crow::json::load(req.body);
            if (!body) {
                std::cerr << "[ERROR] JSON load returned null." << std::endl;
                auto res = crow::response(400, "Invalid JSON");
                res.add_header("Access-Control-Allow-Origin", "*");
                return res;
            }
        } catch (const std::exception& e) {
            std::cerr << "[ERROR] Crow JSON load exception: " << e.what() << std::endl;
            auto res = crow::response(400, "JSON Parse Error");
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        if (!body.has("code") || body["code"].t() != crow::json::type::String) {
            std::cerr << "[ERROR] 'code' field missing or not a string." << std::endl;
            auto res = crow::response(400, "Missing or invalid 'code' field");
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        std::string code = body["code"].s();
        std::cerr << "[DEBUG] Code successfully extracted. Length: " << code.length() << std::endl;

        std::vector<int> simInputs;
        if (body.has("inputs") && body["inputs"].t() == crow::json::type::List) {
            std::cerr << "[DEBUG] Extracting inputs..." << std::endl;
            for (auto& x : body["inputs"]) {
                try {
                    simInputs.push_back(x.i());
                } catch(...) {
                    std::cerr << "[WARNING] Non-integer input skipped." << std::endl;
                }
            }
            std::cerr << "[DEBUG] Inputs extracted: " << simInputs.size() << std::endl;
        }

        crow::json::wvalue result;

        try {
            std::cerr << "[DEBUG] Starting parsing/simulation pipeline..." << std::endl;
            auto tokens = tokenize(code);
            std::cerr << "[DEBUG] Tokenization complete. Tokens: " << tokens.size() << std::endl;
            Parser parser(tokens);
            Node* root = parser.parse();
            std::cerr << "[DEBUG] Parsing complete." << std::endl;

            ExecutionEngine engine;
            engine.setInputs(simInputs);
            std::cerr << "[DEBUG] Running simulation..." << std::endl;
            auto steps = engine.run(root);
            std::cerr << "[DEBUG] Simulation complete. Steps: " << steps.size() << std::endl;

            result["ast"] = astToJson(root);
            
            if (steps.empty()) {
                result["simulation"] = crow::json::wvalue::list();
                result["status"] = "completed";
            } else {
                if (steps.back().action == "waiting_input") {
                    result["status"] = "waiting_input";
                    result["expected_var"] = steps.back().var;
                } else {
                    result["status"] = "completed";
                }
                
                for (size_t i = 0; i < steps.size(); i++) {
                    result["simulation"][i]["line"] = steps[i].line;
                    result["simulation"][i]["action"] = steps[i].action;
                    result["simulation"][i]["var"] = steps[i].var;
                    result["simulation"][i]["value"] = steps[i].value;
                }
            }
        } catch(...) {
            std::cerr << "[ERROR] Pipeline crashed." << std::endl;
            result["ast"] = crow::json::wvalue();
            result["simulation"] = crow::json::wvalue::list();
            result["status"] = "error";
        }

        std::cerr << "[DEBUG] Fetching AI suggestions..." << std::endl;
        auto aiResult = AIAnalyzer::fetchAISuggestions(code);
        std::cerr << "[DEBUG] AI suggestions received." << std::endl;

        result["error"] = std::move(aiResult["error"]);
        result["algorithm_name"] = std::move(aiResult["algorithm_name"]);
        result["description"] = std::move(aiResult["description"]);
        result["overall_time_complexity"] = std::move(aiResult["overall_time_complexity"]);
        result["overall_space_complexity"] = std::move(aiResult["overall_space_complexity"]);
        result["functions"] = std::move(aiResult["functions"]);
        result["suggestions"] = std::move(aiResult["suggestions"]);
        result["graph_states"] = std::move(aiResult["graph_states"]);

        auto res = crow::response(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type");
        std::cerr << "[DEBUG] Request successfully processed." << std::endl;
        return res;
    });

    app.port(18080).multithreaded().run();
}