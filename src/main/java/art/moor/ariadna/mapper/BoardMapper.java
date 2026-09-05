package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.board.BoardFullDto;
import art.moor.ariadna.data.dto.board.BoardMyAccessDto;
import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.boardUser.BoardMemberDto;
import art.moor.ariadna.data.model.Board;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BoardMapper {
    @Mapping(source = "board.owner.id", target = "ownerId")
    @Mapping(source = "myAccess", target = "myAccess")
    BoardResponseDto toDto(Board board, BoardMyAccessDto myAccess);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "boardUsers", ignore = true)
    Board fromDto(BoardRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "boardUsers", ignore = true)
    void updateEntity(BoardRequestDto dto, @MappingTarget Board board);

    @Mapping(source = "board.owner.id", target = "ownerId")
    @Mapping(source = "myAccess", target = "myAccess")
    @Mapping(source = "members", target = "members")
    @Mapping(source = "columns", target = "columns")
    BoardFullDto toFullBoard(
            Board board,
            BoardMyAccessDto myAccess,
            List<BoardMemberDto> members,
            List<BoardColumnWithCardsDto> columns
    );
}
