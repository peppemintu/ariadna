package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.card.CardCreateDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.dto.card.CardUpdateDto;
import art.moor.ariadna.data.model.Card;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CardMapper {

    @Mapping(source = "board.id",    target = "boardId")
    @Mapping(source = "column.id",   target = "columnId")
    @Mapping(source = "assignee.id", target = "assigneeId")
    CardResponseDto toDto(Card card);

    @Mapping(target = "id",          ignore = true)
    @Mapping(target = "board",       ignore = true)
    @Mapping(target = "column",      ignore = true)
    @Mapping(target = "assignee",    ignore = true)
    @Mapping(target = "position",    ignore = true)
    @Mapping(target = "version",     ignore = true)
    @Mapping(target = "createdAt",   ignore = true)
    @Mapping(target = "updatedAt",   ignore = true)
    Card fromCreate(CardCreateDto dto);

    @Mapping(target = "id",          ignore = true)
    @Mapping(target = "board",       ignore = true)
    @Mapping(target = "column",      ignore = true)
    @Mapping(target = "assignee",    ignore = true)
    @Mapping(target = "position",    ignore = true)
    @Mapping(target = "createdAt",   ignore = true)
    @Mapping(target = "updatedAt",   ignore = true)
    void updateEntity(CardUpdateDto dto, @MappingTarget Card card);
}
