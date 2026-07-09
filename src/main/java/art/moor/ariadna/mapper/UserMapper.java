package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.user.UserCreateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.data.dto.user.UserUpdateRequestDto;
import art.moor.ariadna.data.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponseDto toDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "role", expression = "java(art.moor.ariadna.data.model.UserRole.USER)")
    User fromCreate(UserCreateRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "role", ignore = true)
    void updateEntity(UserUpdateRequestDto dto, @MappingTarget User user);
}
