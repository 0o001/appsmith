package com.appsmith.server.solutions.ce;

import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Scheduler;

@RequiredArgsConstructor
@Slf4j
@Component
public class ScheduledTaskCEImpl implements ScheduledTaskCE {

    private final FeatureFlagService featureFlagService;

    private final TenantService tenantService;

    private final Scheduler scheduler;

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 30 * 60 * 1000 /* thirty minutes */)
    public void fetchFeatures() {
        log.info("Fetching features for default tenant");
        featureFlagService
                .getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations()
                .then(tenantService
                        .getDefaultTenant()
                        .flatMap(featureFlagService::checkAndExecuteMigrationsForTenantFeatureFlags))
                .doOnError(error -> log.error("Error while fetching features from Cloud Services {0}", error))
                .subscribeOn(scheduler)
                .subscribe();
    }
}
