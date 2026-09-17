package com.scan2serve.dto;

public class LoginResponse {

    private String token;
    private String tokenType;
    private EmployeeResponse employee;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String tokenType,
            EmployeeResponse employee
    ) {
        this.token = token;
        this.tokenType = tokenType;
        this.employee = employee;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public EmployeeResponse getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeResponse employee) {
        this.employee = employee;
    }
}