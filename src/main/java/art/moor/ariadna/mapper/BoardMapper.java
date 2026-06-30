package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.model.Board;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BoardMapper {
    BoardResponseDto toDto(Board board);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Board fromDto(BoardRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(BoardRequestDto dto, @MappingTarget Board board);
}
