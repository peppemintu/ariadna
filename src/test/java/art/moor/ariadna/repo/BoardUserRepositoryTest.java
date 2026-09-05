package art.moor.ariadna.repo;

import art.moor.ariadna.IntegrationTestBase;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class BoardUserRepositoryTest extends IntegrationTestBase {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BoardUserRepository boardUserRepository;

    private User newUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("$2y$10$wlt/n1Gr5zE15Du10YF1v.ULRZsnW9e67nGM4dAupUQRfxDJ.evBS");
        user.setName("user");
        user.setRole(UserRole.ADMIN);
        return userRepository.save(user);
    }

    @Test
    void findByIdAndBoardId_assigneeFromAnotherBoard_returnsEmptyOptional() {
        User owner = newUser("test@email.com");

        Board boardA = new Board();
        boardA.setTitle("Board A");
        boardA.setOwner(owner);
        Board savedBoardA = boardRepository.save(boardA);

        Board boardB = new Board();
        boardB.setTitle("Board B");
        boardB.setOwner(owner);
        Board savedBoardB = boardRepository.save(boardB);

        BoardUser boardUser = new BoardUser();
        boardUser.setBoard(savedBoardB);
        boardUser.setUser(owner);
        BoardUser savedBoardUser = boardUserRepository.save(boardUser);

        Optional<BoardUser> assignee =
                boardUserRepository.findByUserIdAndBoardId(savedBoardUser.getId(), savedBoardA.getId());

        assertThat(assignee).isEmpty();
    }

    @Test
    void findByIdAndBoardId_assigneeFromSameBoard_returnsBoardUser() {
        User owner = newUser("same@email.com");

        Board board = new Board();
        board.setTitle("Board A");
        board.setOwner(owner);
        Board savedBoard = boardRepository.save(board);

        BoardUser boardUser = new BoardUser();
        boardUser.setBoard(savedBoard);
        boardUser.setUser(owner);
        BoardUser saved = boardUserRepository.save(boardUser);

        Optional<BoardUser> found =
                boardUserRepository.findByUserIdAndBoardId(saved.getId(), savedBoard.getId());

        assertThat(found).contains(saved);
    }
}
