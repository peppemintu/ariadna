package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.boardColumn.BoardColumnCreateDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnUpdateDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.model.BoardColumn;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BoardColumnMapper {

    @Mapping(source = "board.id", target = "boardId")
    BoardColumnResponseDto toDto(BoardColumn column);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "board",     ignore = true)
    @Mapping(target = "position",  ignore = true)
    @Mapping(target = "version",   ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "color",     defaultValue = "#252525")
    BoardColumn fromCreate(BoardColumnCreateDto dto);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "board",     ignore = true)
    @Mapping(target = "position",  ignore = true)
    @Mapping(target = "version",   ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "color",     defaultValue = "#252525")
    void updateEntity(BoardColumnUpdateDto dto, @MappingTarget BoardColumn column);

    @Mapping(source = "column.board.id", target = "boardId")
    @Mapping(source = "cards", target = "cards")
    BoardColumnWithCardsDto toDto(BoardColumn column, List<CardResponseDto> cards);
}
