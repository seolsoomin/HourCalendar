package com.hour.auth;

import java.io.Serializable;

public record LoginUser(Long userId, String loginId) implements Serializable {}
