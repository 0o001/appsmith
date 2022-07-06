package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.UserAndGroupDTO;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserWorkspaceServiceCE {

    Mono<User> leaveWorkspace(String workspaceId);

    Mono<UserAndGroupDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader);

    Mono<List<UserAndGroupDTO>> getWorkspaceMembers(String workspaceId);
}
