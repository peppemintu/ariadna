package art.moor.ariadna.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "card")
@DiscriminatorValue("CARD")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
public class Card extends BoardItem {

    @Column(columnDefinition = "text")
    private String description;

    private Instant deadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private BoardUser assignee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;
}