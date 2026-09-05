package art.moor.ariadna.data.model;

/**
 * Atomic, grantable capabilities on a board. Adding a new one here needs no
 * migration — it's just a new string that can appear in board_user_permission.
 * The owner (Board.ownerId) always has every permission implicitly and never
 * needs rows here; membership (read access) is likewise implicit in having a
 * BoardUser row at all, not a permission of its own.
 */
public enum BoardPermission {
    EDIT_CARDS,
    MANAGE_MEMBERS,
}
