#include "Compiler.h"
#include <fstream>
#include <cstdlib>

CompileResult runCompiler(std::string code) {
    CompileResult res;

    std::ofstream f("temp.c");
    f << code;
    f.close();

    int c = system("gcc temp.c -o temp.exe 2> err.txt");

    if (c != 0) {
        std::ifstream err("err.txt");
        res.error = std::string((std::istreambuf_iterator<char>(err)),
                                 std::istreambuf_iterator<char>());
        return res;
    }

    system("temp.exe > out.txt");

    std::ifstream out("out.txt");
    res.output = std::string((std::istreambuf_iterator<char>(out)),
                              std::istreambuf_iterator<char>());

    return res;
}