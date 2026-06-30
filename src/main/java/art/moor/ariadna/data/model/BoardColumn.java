package art.moor.ariadna.data.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board_column")
@AllArgsConstructor
@NoArgsConstructor
@DiscriminatorValue("COLUMN")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
public class BoardColumn extends BoardItem {

    @Column(nullable = false, length = 7)
    private String color = "#252525";

}