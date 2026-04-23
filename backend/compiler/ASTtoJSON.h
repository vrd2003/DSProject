#pragma once
#include "../parser/AST.h"
#include "../crow_all.h"
#include <string>

std::string nodeTypeToString(NodeType type);
crow::json::wvalue astToJson(Node* root);
