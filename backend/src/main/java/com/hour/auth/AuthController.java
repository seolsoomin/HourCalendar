package com.hour.auth;

import com.hour.auth.email.EmailVerificationService;
import com.hour.user.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final SecurityContextRepository securityContextRepository;

    @GetMapping("/check-id")
    public AuthDto.IdCheck checkId(@RequestParam String loginId) {
        return new AuthDto.IdCheck(authService.isLoginIdAvailable(loginId));
    }

    @PostMapping("/email/send")
    public void sendCode(@Valid @RequestBody AuthDto.SendCode req) {
        emailVerificationService.sendCode(req.email(), req.purpose(), req.loginId());
    }

    @PostMapping("/email/verify")
    public void verifyCode(@Valid @RequestBody AuthDto.VerifyCode req) {
        emailVerificationService.verify(req.email(), req.purpose(), req.code());
    }

    @PostMapping("/find-id")
    public AuthDto.FoundId findId(@Valid @RequestBody AuthDto.FindId req) {
        return authService.findLoginId(req);
    }

    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody AuthDto.ResetPassword req) {
        authService.resetPassword(req);
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto.Me signup(@Valid @RequestBody AuthDto.Signup req) {
        return authService.signup(req);
    }

    @PostMapping("/login")
    public UserDto.Me login(@Valid @RequestBody AuthDto.Login req,
                            HttpServletRequest request,
                            HttpServletResponse response) {
        UserDto.Me me = authService.authenticate(req);

        LoginUser principal = new LoginUser(me.userId(), me.loginId());
        UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        request.getSession(true);
        request.changeSessionId();
        securityContextRepository.saveContext(context, request, response);

        return me;
    }
}
