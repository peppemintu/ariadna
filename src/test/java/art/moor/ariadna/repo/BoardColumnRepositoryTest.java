package art.moor.ariadna.repo;

import art.moor.ariadna.IntegrationTestBase;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardColumn;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class BoardColumnRepositoryTest extends IntegrationTestBase {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private BoardColumnRepository boardColumnRepository;

    @Test
    void findMaxPositionByBoardId_emptyBoard_returnsEmptyOptional() {
        Board board = new Board();
        board.setTitle("Empty board");
        Board savedBoard = boardRepository.save(board);

        Optional<Double> maxPosition = boardColumnRepository.findMaxPositionByBoardId(savedBoard.getId());

        assertThat(maxPosition).isEmpty();
    }

    @Test
    void findMaxPositionByBoardId_multipleColumns_returnsMax() {
        Board board = new Board();
        board.setTitle("Board we perform search in");
        Board savedBoard = boardRepository.save(board);

        saveColumn(savedBoard, 1000.0);
        saveColumn(savedBoard, 3000.0);
        saveColumn(savedBoard, 2000.0);

        Board otherBoard = new Board();
        otherBoard.setTitle("Board which column should be ignored");
        Board savedOtherBoard = boardRepository.save(otherBoard);
        saveColumn(savedOtherBoard, 9000.0);

        Optional<Double> maxPosition = boardColumnRepository.findMaxPositionByBoardId(savedBoard.getId());

        assertThat(maxPosition).contains(3000.0);
    }

    private void saveColumn(Board board, double position) {
        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setTitle("Column " + position);
        column.setPosition(position);
        boardColumnRepository.save(column);
    }

}
