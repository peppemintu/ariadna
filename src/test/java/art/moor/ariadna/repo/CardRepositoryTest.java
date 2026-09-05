package art.moor.ariadna.repo;

import art.moor.ariadna.IntegrationTestBase;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardColumn;
import art.moor.ariadna.data.model.Card;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class CardRepositoryTest extends IntegrationTestBase {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BoardColumnRepository boardColumnRepository;

    @Autowired
    private CardRepository cardRepository;

    private User newOwner() {
        User user = new User();
        user.setEmail(UUID.randomUUID() + "@example.com");
        user.setPasswordHash("hash");
        user.setName("Owner");
        user.setRole(UserRole.USER);
        return userRepository.save(user);
    }

    @Test
    void findMaxPositionByColumnId_emptyColumn_returnsEmptyOptional() {
        Board board = new Board();
        board.setTitle("Test board");
        board.setOwner(newOwner());
        Board savedBoard = boardRepository.save(board);

        BoardColumn savedColumn = saveColumn(savedBoard);

        Optional<Double> maxPosition = cardRepository.findMaxPositionByColumnId(savedColumn.getId());

        assertThat(maxPosition).isEmpty();
    }

    @Test
    void findMaxPositionByColumnId_multipleCards_returnsMax() {
        Board board = new Board();
        board.setTitle("Test board");
        board.setOwner(newOwner());
        Board savedBoard = boardRepository.save(board);

        BoardColumn savedColumn = saveColumn(savedBoard);

        saveCard(savedBoard, savedColumn, 1000.0);
        saveCard(savedBoard, savedColumn, 3000.0);
        saveCard(savedBoard, savedColumn, 2000.0);

        Optional<Double> maxPosition = cardRepository.findMaxPositionByColumnId(savedColumn.getId());

        assertThat(maxPosition).contains(3000.0);
    }

    private BoardColumn saveColumn(Board board) {
        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setTitle("Test column");
        column.setPosition(1000.0);
        return boardColumnRepository.save(column);
    }

    private void saveCard(Board board, BoardColumn column, double position) {
        Card card = new Card();
        card.setBoard(board);
        card.setColumn(column);
        card.setTitle("Card " + position);
        card.setPosition(position);
        cardRepository.save(card);
    }

}
