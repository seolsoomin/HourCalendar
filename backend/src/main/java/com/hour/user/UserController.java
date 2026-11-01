package com.hour.user;

import com.hour.auth.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProfileImageService profileImageService;
    private final WithdrawService withdrawService;

    @GetMapping("/me")
    public UserDto.Me me(@AuthenticationPrincipal LoginUser user) {
        return userService.getMe(user.userId());
    }

    @PutMapping("/me")
    public UserDto.Me updateProfile(@AuthenticationPrincipal LoginUser user,
                                    @Valid @RequestBody UserDto.ProfileUpdate req) {
        return userService.updateProfile(user.userId(), req);
    }

    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDto.Me uploadProfileImage(@AuthenticationPrincipal LoginUser user,
                                         @RequestParam("file") MultipartFile file) {
        return profileImageService.upload(user.userId(), file);
    }

    @DeleteMapping("/me/profile-image")
    public UserDto.Me removeProfileImage(@AuthenticationPrincipal LoginUser user) {
        return profileImageService.remove(user.userId());
    }

    @PostMapping("/me/withdraw")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal LoginUser user,
                         @Valid @RequestBody UserDto.Withdraw req,
                         HttpServletRequest request) {
        withdrawService.withdraw(user.userId(), req.password());

        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
