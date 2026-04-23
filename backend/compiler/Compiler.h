#pragma once
#include <string>

struct CompileResult {
    std::string output;
    std::string error;
};

CompileResult runCompiler(std::string code);