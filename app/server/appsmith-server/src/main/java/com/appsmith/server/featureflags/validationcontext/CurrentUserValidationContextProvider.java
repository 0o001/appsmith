package com.appsmith.server.featureflags.validationcontext;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class CurrentUserValidationContextProvider implements FeatureFlagValidationContextProvider<Mono<User>> {

    private final SessionUserService sessionUserService;
    @Autowired
    public CurrentUserValidationContextProvider(SessionUserService sessionUserService) {
        this.sessionUserService = sessionUserService;
    }
    @Override
    public Mono<User> getFeatureFlagValidationContext() {
        return sessionUserService.getCurrentUser();
    }
}