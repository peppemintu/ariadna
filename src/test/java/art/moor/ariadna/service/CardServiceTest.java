package art.moor.ariadna.service;

import art.moor.ariadna.IntegrationTestBase;
import art.moor.ariadna.config.security.CustomUserDetails;
import art.moor.ariadna.data.dto.card.CardUpdateDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.model.*;
import art.moor.ariadna.repo.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class CardServiceTest extends IntegrationTestBase {

    @Autowired private CardService cardService;
    @Autowired private CardRepository cardRepository;
    @Autowired private BoardColumnRepository boardColumnRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private BoardUserRepository boardUserRepository;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void clean() {
        cardRepository.deleteAll();
        boardColumnRepository.deleteAll();
        boardUserRepository.deleteAll();
        boardRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    /** Owns the board it creates — permission checks in CardService pass trivially. */
    private Board newOwnedBoard() {
        User owner = new User();
        owner.setEmail(UUID.randomUUID() + "@example.com");
        owner.setPasswordHash("hash");
        owner.setName("Owner");
        owner.setRole(UserRole.USER);
        owner = userRepository.save(owner);

        Board board = new Board();
        board.setTitle("Board");
        board.setOwner(owner);
        board = boardRepository.save(board);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(owner), null, new CustomUserDetails(owner).getAuthorities())
        );
        return board;
    }

    @Test
    void update_returnsFreshVersion() {
        Board board = newOwnedBoard();

        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setTitle("Column");
        column.setPosition(1000.0);
        column = boardColumnRepository.save(column);

        Card card = new Card();
        card.setBoard(board);
        card.setColumn(column);
        card.setTitle("Original");
        card.setPosition(1000.0);
        card = cardRepository.save(card);

        CardUpdateDto dto = new CardUpdateDto("Updated title", null, null, 0L);
        CardResponseDto response = cardService.update(card.getId(), dto);

        assertThat(response.version()).isEqualTo(1L);
    }

    @Test
    void update_withStaleVersion_throwsOptimisticLockException() {
        Board board = newOwnedBoard();

        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setTitle("Column");
        column.setPosition(1000.0);
        column = boardColumnRepository.save(column);

        Card card = new Card();
        card.setBoard(board);
        card.setColumn(column);
        card.setTitle("Original");
        card.setPosition(1000.0);
        card = cardRepository.save(card);

        UUID cardId = card.getId();

        cardService.update(cardId, new CardUpdateDto("First update", null, null, 0L));

        assertThatThrownBy(() ->
                cardService.update(cardId, new CardUpdateDto("Stale update", null, null, 0L))
        ).isInstanceOf(ObjectOptimisticLockingFailureException.class);
    }
}
