package art.moor.ariadna.data.model;

import java.util.Set;

/**
 * Named presets over {@link BoardPermission} — a convenience for granting a
 * common bundle in one action. Purely a code-level label: once granted, the
 * permissions are just rows in board_user_permission, and the runtime never
 * asks "what role is this member" again, only "does this member have permission X".
 * A future role (e.g. a card-mover who can't edit card content) is a new
 * constant here, nothing else changes.
 */
public enum BoardRole {
    VIEWER(Set.of()),
    EDITOR(Set.of(BoardPermission.EDIT_CARDS)),
    MANAGER(Set.of(BoardPermission.EDIT_CARDS, BoardPermission.MANAGE_MEMBERS));

    private final Set<BoardPermission> permissions;

    BoardRole(Set<BoardPermission> permissions) {
        this.permissions = permissions;
    }

    public Set<BoardPermission> permissions() {
        return permissions;
    }
}
