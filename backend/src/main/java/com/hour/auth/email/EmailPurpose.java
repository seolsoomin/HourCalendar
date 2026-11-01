package com.hour.auth.email;

public enum EmailPurpose {
    SIGNUP("회원가입"),
    FIND_ID("아이디 찾기"),
    RESET_PASSWORD("비밀번호 재설정");

    private final String label;

    EmailPurpose(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
