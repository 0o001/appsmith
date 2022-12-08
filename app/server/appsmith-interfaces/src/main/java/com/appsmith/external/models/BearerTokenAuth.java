package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.helpers.PluginUtils;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(Authentication.BEARER_TOKEN)
public class BearerTokenAuth extends AuthenticationDTO {

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Encrypted
    String bearerToken;

    @Override
    protected void buildSecretExists(SecretExists secretExists) {
        secretExists.setBearerToken(StringUtils.hasLength(bearerToken));
    }
}