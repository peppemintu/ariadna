package art.moor.ariadna.service;

import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BoardAccessServiceTest {

    private final BoardUserRepository boardUserRepository = mock(BoardUserRepository.class);
    private final BoardRepository boardRepository = mock(BoardRepository.class);
    private final BoardAccessService service = new BoardAccessService(boardUserRepository, boardRepository);

    private User user(UUID id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    private Board boardWithOwner(UUID ownerId) {
        Board board = new Board();
        board.setOwner(user(ownerId));
        return board;
    }

    @Test
    void isMember_trueWhenBoardUserRowExists() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardUserRepository.findByUserIdAndBoardId(userId, boardId))
                .thenReturn(Optional.of(new BoardUser()));

        assertThat(service.isMember(userId, boardId)).isTrue();
    }

    @Test
    void isMember_falseWhenNoBoardUserRow() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardUserRepository.findByUserIdAndBoardId(userId, boardId)).thenReturn(Optional.empty());

        assertThat(service.isMember(userId, boardId)).isFalse();
    }

    @Test
    void isOwner_trueWhenUserIsBoardOwner() {
        UUID ownerId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardRepository.findById(boardId)).thenReturn(Optional.of(boardWithOwner(ownerId)));

        assertThat(service.isOwner(ownerId, boardId)).isTrue();
    }

    @Test
    void isOwner_falseForNonOwnerOrMissingBoard() {
        UUID boardId = UUID.randomUUID();
        when(boardRepository.findById(boardId)).thenReturn(Optional.of(boardWithOwner(UUID.randomUUID())));
        assertThat(service.isOwner(UUID.randomUUID(), boardId)).isFalse();

        UUID missingBoardId = UUID.randomUUID();
        when(boardRepository.findById(missingBoardId)).thenReturn(Optional.empty());
        assertThat(service.isOwner(UUID.randomUUID(), missingBoardId)).isFalse();
    }

    @Test
    void hasPermission_ownerAlwaysTrueRegardlessOfStoredPermissions() {
        UUID ownerId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardRepository.findById(boardId)).thenReturn(Optional.of(boardWithOwner(ownerId)));

        assertThat(service.hasPermission(ownerId, boardId, BoardPermission.MANAGE_MEMBERS)).isTrue();
        assertThat(service.hasPermission(ownerId, boardId, BoardPermission.EDIT_CARDS)).isTrue();
    }

    @Test
    void hasPermission_memberTrueOnlyWhenPermissionGranted() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardRepository.findById(boardId)).thenReturn(Optional.of(boardWithOwner(UUID.randomUUID())));

        BoardUser boardUser = new BoardUser();
        boardUser.setPermissions(Set.of(BoardPermission.EDIT_CARDS));
        when(boardUserRepository.findByUserIdAndBoardId(userId, boardId)).thenReturn(Optional.of(boardUser));

        assertThat(service.hasPermission(userId, boardId, BoardPermission.EDIT_CARDS)).isTrue();
        assertThat(service.hasPermission(userId, boardId, BoardPermission.MANAGE_MEMBERS)).isFalse();
    }

    @Test
    void hasPermission_falseWhenNotAMember() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardRepository.findById(boardId)).thenReturn(Optional.of(boardWithOwner(UUID.randomUUID())));
        when(boardUserRepository.findByUserIdAndBoardId(any(), any())).thenReturn(Optional.empty());

        assertThat(service.hasPermission(userId, boardId, BoardPermission.EDIT_CARDS)).isFalse();
    }
}
