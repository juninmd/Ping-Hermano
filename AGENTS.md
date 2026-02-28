```markdown
# AGENTS.md - AI Coding Agent Guidelines

These guidelines are designed to ensure consistent, maintainable, and high-quality code for our AI coding agents. Adherence to these principles will maximize productivity and minimize future maintenance overhead.

## 1. DRY (Don't Repeat Yourself)

*   **Single Responsibility Principle:** Each agent function or module should have a single, clearly defined purpose.
*   **Abstraction:** Use abstractions where possible to represent common patterns and data structures.
*   **Code Reuse:** Design modules and functions to be reusable across multiple agents or projects.
*   **Documentation:** Provide clear documentation for all code, explaining the purpose, inputs, and outputs.

## 2. KISS (Keep It Simple, Stupid)

*   **Minimalism:** Strive for the simplest possible solution that meets the current requirements.
*   **Readability:** Code should be easy to understand – use descriptive variable names, comments, and formatting.
*   **Efficiency:** Prioritize efficiency; avoid unnecessary complexity.
*   **Testability:** Design code that’s easy to test.

## 3. SOLID Principles

*   **Single Responsibility:** Each class/module encapsulates a single responsibility.
*   **Open/Closed Principle:**  The system should be extensible without modifying the existing code. (Limited use of modifications)
*   **Liskov Substitution Principle:**  Subclasses should be substitutable for their base classes without altering the correctness of the program.
*   **Interface Segregation Principle:** Clients shouldn't be forced to implement interfaces they don't use.
*   **Dependency Inversion Principle:**  High-level modules should be dependent on low-level modules, not vice versa.

## 4. YAGNI (You Aren't Gonna Need It)

*   **Avoid Over-Engineering:** Don’t add features or complexity that aren’t currently required.
*   **Focus on Core Functionality:** Prioritize implementing the essential requirements of the agent.
*   **Refactor Only When Necessary:**  Refactoring should be driven by the need for improved design or performance, not by a desire to "fix" existing code.

## 5. Development Guidelines

*   **Coding Standards:** Adhere to the established coding style (refer to [Style Guide Link]).
*   **Error Handling:** Implement appropriate error handling, logging, and exception handling.
*   **Testing:** All development must be productive.  Use mocks and stubs *exclusively* for unit and integration tests.
*   **Code Reviews:**  All code changes must be reviewed by at least one other agent.
*   **Documentation Updates:**  Maintain up-to-date documentation within the code.
*   **Version Control:** Use Git for version control; commit frequently and with clear commit messages.

## 6. File Size Limits

*   **Maximum Code Length:** 180 lines of code per file.
*   **File Structure:** Files should have a clear and logical directory structure.

## 7. Test Coverage Requirements

*   **Target Coverage:**  Achieve a minimum of 85% test coverage.
*   **Test Types:** Include unit tests, integration tests, and edge case tests.
*   **Test Data:** Utilize realistic test data for thorough testing.

## 8.  Framework Usage

*   Utilize [Framework Name] for [Specific Purpose].
*   Documentation for framework usage should be readily available.

## 9.  Other Considerations

*   **Data Structures:** Carefully select data structures to optimize performance.
*   **Algorithm Selection:** Choose appropriate algorithms for each task.
*   **Security:**  Implement basic security measures to protect against common vulnerabilities (if applicable).

## 10.  Documentation

*   Provide concise and helpful comments within the code to explain complex logic.
*   Document API usage.

These guidelines are subject to change.  Updates will be communicated to all agents.
```