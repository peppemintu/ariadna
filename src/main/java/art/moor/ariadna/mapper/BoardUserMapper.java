package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.boardUser.BoardMemberDto;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.model.BoardUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BoardUserMapper {
    @Mapping(source = "board.id", target = "boardId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "owner", expression = "java(boardUser.getBoard().getOwner().getId().equals(boardUser.getUser().getId()))")
    BoardUserResponseDto toDto(BoardUser boardUser);

    @Mapping(source = "user.id", target = "id")
    @Mapping(target = "boardUserId", source = "id")
    @Mapping(source = "user.name", target = "name")
    @Mapping(source = "user.email", target = "email")
    @Mapping(target = "owner", expression = "java(boardUser.getBoard().getOwner().getId().equals(boardUser.getUser().getId()))")
    BoardMemberDto toMemberDto(BoardUser boardUser);
}
