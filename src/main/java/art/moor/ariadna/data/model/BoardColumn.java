package art.moor.ariadna.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "board_column")
@DiscriminatorValue("COLUMN")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
public class BoardColumn extends BoardItem {

    @Column(nullable = false, length = 7)
    private String color = "#252525";
}