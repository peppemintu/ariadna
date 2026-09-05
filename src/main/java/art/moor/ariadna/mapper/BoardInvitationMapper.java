package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.invitation.InvitationResponseDto;
import art.moor.ariadna.data.model.BoardInvitation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BoardInvitationMapper {
    @Mapping(source = "board.id", target = "boardId")
    @Mapping(source = "board.title", target = "boardTitle")
    @Mapping(source = "invitedBy.id", target = "invitedById")
    @Mapping(source = "invitedBy.name", target = "invitedByName")
    InvitationResponseDto toDto(BoardInvitation invitation);
}
