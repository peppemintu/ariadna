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

    @Test
    void findByIdAndBoardId_assigneeFromAnotherBoard_returnsEmptyOptional() {
        Board boardA = new Board();
        boardA.setTitle("Board A");
        Board savedBoardA = boardRepository.save(boardA);

        Board boardB = new Board();
        boardB.setTitle("Board B");
        Board savedBoardB = boardRepository.save(boardB);

        User user = new User();
        user.setEmail("test@email.com");
        user.setPasswordHash("$2y$10$wlt/n1Gr5zE15Du10YF1v.ULRZsnW9e67nGM4dAupUQRfxDJ.evBS");
        user.setName("user");
        user.setRole(UserRole.ADMIN);
        User savedUser = userRepository.save(user);

        BoardUser boardUser = new BoardUser();
        boardUser.setBoard(savedBoardB);
        boardUser.setUser(savedUser);
        BoardUser savedBoardUser = boardUserRepository.save(boardUser);

        Optional<BoardUser> assignee =
                boardUserRepository.findByIdAndBoardId(savedBoardUser.getId(), savedBoardA.getId());

        assertThat(assignee).isEmpty();
    }

    @Test
    void findByIdAndBoardId_assigneeFromSameBoard_returnsBoardUser() {
        Board board = new Board();
        board.setTitle("Board A");
        Board savedBoard = boardRepository.save(board);

        User user = new User();
        user.setEmail("same@email.com");
        user.setPasswordHash("$2y$10$wlt/n1Gr5zE15Du10YF1v.ULRZsnW9e67nGM4dAupUQRfxDJ.evBS");
        user.setName("user");
        user.setRole(UserRole.ADMIN);
        User savedUser = userRepository.save(user);

        BoardUser boardUser = new BoardUser();
        boardUser.setBoard(savedBoard);
        boardUser.setUser(savedUser);
        BoardUser saved = boardUserRepository.save(boardUser);

        Optional<BoardUser> found =
                boardUserRepository.findByIdAndBoardId(saved.getId(), savedBoard.getId());

        assertThat(found).contains(saved);
    }
}
