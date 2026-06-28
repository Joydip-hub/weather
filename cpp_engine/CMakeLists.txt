cmake_minimum_required(VERSION 3.10)
project(weather_engine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Build as a shared library
add_library(weather_engine SHARED
    src/weather_engine.h
    src/weather_engine.cpp
)

# CLI test program
add_executable(weather_cli
    src/main.cpp
)
target_link_libraries(weather_cli PRIVATE weather_engine)

# Install targets
install(TARGETS weather_engine DESTINATION lib)
install(FILES src/weather_engine.h DESTINATION include)
