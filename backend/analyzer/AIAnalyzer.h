#pragma once
#include <string>
#include "../crow_all.h"

class AIAnalyzer {
public:
    static crow::json::wvalue fetchAISuggestions(const std::string& code);
private:
    static crow::json::wvalue fallbackAISuggestions();
};
