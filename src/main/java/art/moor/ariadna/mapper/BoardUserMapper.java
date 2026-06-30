package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.model.BoardUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BoardUserMapper {
    @Mapping(source = "board.id", target = "boardId")
    @Mapping(source = "user.id", target = "userId")
    BoardUserResponseDto toDto(BoardUser boardUser);
}
