package com.appsmith.server.services;

import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.services.ce.PackageServiceCEImpl;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class PackageServiceImpl extends PackageServiceCEImpl implements PackageService {

    public PackageServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PackageRepository repository,
            AnalyticsService analyticsService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService);
    }
}
