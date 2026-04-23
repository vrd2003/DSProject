#include "Tokenizer.h"
#include <cctype>

std::vector<Token> tokenize(std::string code) {
    std::vector<Token> tokens;

    for (int i = 0; i < code.size(); i++) {
        char c = code[i];

        if (isspace(c)) continue;

        if (c == '#') {
            while (i < code.size() && code[i] != '\n') i++;
            continue;
        }

        if (isdigit(c)) {
            std::string num;
            while (i < code.size() && isdigit(code[i])) num += code[i++];
            i--;
            tokens.push_back({T_NUMBER, num});
        }
        else if (isalpha(c) || c == '_') {
            std::string word;
            while (i < code.size() && (isalnum(code[i]) || code[i] == '_')) word += code[i++];
            i--;

            if (word == "if" || word == "for" || word == "while" || word == "int" || word == "float" || word == "double" || word == "bool" || word == "char" || word == "string" || word == "long" || word == "switch" || word == "case" || word == "break" || word == "using" || word == "namespace")
                tokens.push_back({T_KEYWORD, word});
            else
                tokens.push_back({T_IDENTIFIER, word});
        }
        else {
            if (i + 1 < code.size() && (
                 (c == '=' && code[i+1] == '=') ||
                 (c == '<' && code[i+1] == '=') ||
                 (c == '>' && code[i+1] == '=') ||
                 (c == '>' && code[i+1] == '>') ||
                 (c == '<' && code[i+1] == '<') ||
                 (c == '!' && code[i+1] == '='))) {
                tokens.push_back({T_OPERATOR, code.substr(i, 2)});
                i++;
            } else {
                tokens.push_back({T_OPERATOR, std::string(1, c)});
            }
        }
    }

    return tokens;
}