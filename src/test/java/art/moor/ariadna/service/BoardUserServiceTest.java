package art.moor.ariadna.service;

import art.moor.ariadna.config.security.BoardAccessGuard;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.exception.BoardUserNotFoundException;
import art.moor.ariadna.mapper.BoardUserMapper;
import art.moor.ariadna.repo.BoardUserRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BoardUserServiceTest {

    private final BoardUserRepository boardUserRepository = mock(BoardUserRepository.class);
    private final BoardAccessGuard boardAccessGuard = mock(BoardAccessGuard.class);
    private final BoardUserMapper boardUserMapper = Mappers.getMapper(BoardUserMapper.class);
    private final BoardUserService service = new BoardUserService(boardUserRepository, boardUserMapper, boardAccessGuard);

    private User user(UUID id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    private BoardUser membership(UUID boardId, UUID ownerId, UUID memberId, Set<BoardPermission> permissions) {
        Board board = new Board();
        board.setId(boardId);
        board.setOwner(user(ownerId));

        BoardUser boardUser = new BoardUser();
        boardUser.setId(UUID.randomUUID());
        boardUser.setBoard(board);
        boardUser.setUser(user(memberId));
        boardUser.setPermissions(permissions);
        return boardUser;
    }

    @Test
    void updatePermissions_rejectsTouchingTheOwnersOwnRow() {
        UUID boardId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        BoardUser ownerRow = membership(boardId, ownerId, ownerId, Set.of());
        when(boardUserRepository.findById(ownerRow.getId())).thenReturn(Optional.of(ownerRow));

        assertThatThrownBy(() -> service.updatePermissions(ownerRow.getId(), Set.of(BoardPermission.EDIT_CARDS)))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(boardAccessGuard);
    }

    @Test
    void updatePermissions_plainMemberRequiresManageMembersPermission() {
        UUID boardId = UUID.randomUUID();
        BoardUser target = membership(boardId, UUID.randomUUID(), UUID.randomUUID(), Set.of());
        when(boardUserRepository.findById(target.getId())).thenReturn(Optional.of(target));

        service.updatePermissions(target.getId(), Set.of(BoardPermission.EDIT_CARDS));

        verify(boardAccessGuard).requirePermission(boardId, BoardPermission.MANAGE_MEMBERS);
        verify(boardAccessGuard, never()).requireOwner(any());
        assertThat(target.getPermissions()).containsExactly(BoardPermission.EDIT_CARDS);
    }

    @Test
    void updatePermissions_touchingAnotherManagerAlsoRequiresOwner() {
        UUID boardId = UUID.randomUUID();
        BoardUser managerTarget = membership(boardId, UUID.randomUUID(), UUID.randomUUID(),
                Set.of(BoardPermission.MANAGE_MEMBERS));
        when(boardUserRepository.findById(managerTarget.getId())).thenReturn(Optional.of(managerTarget));

        service.updatePermissions(managerTarget.getId(), Set.of());

        verify(boardAccessGuard).requirePermission(boardId, BoardPermission.MANAGE_MEMBERS);
        verify(boardAccessGuard).requireOwner(boardId);
    }

    @Test
    void remove_rejectsRemovingTheOwner() {
        UUID boardId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        BoardUser ownerRow = membership(boardId, ownerId, ownerId, Set.of());
        when(boardUserRepository.findById(ownerRow.getId())).thenReturn(Optional.of(ownerRow));

        assertThatThrownBy(() -> service.remove(ownerRow.getId()))
                .isInstanceOf(AccessDeniedException.class);
        verify(boardUserRepository, never()).deleteById(any());
    }

    @Test
    void remove_unknownBoardUserThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(boardUserRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.remove(id)).isInstanceOf(BoardUserNotFoundException.class);
    }
}
