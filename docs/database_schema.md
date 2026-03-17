# Database Schema

## Collections

### `participants`
*   `usn`: String (Unique, PK)
*   `name`: String
*   `year`: Number
*   `track`: String (`1st_year` or `2nd_year`)
*   `phase1Score`: Number
*   `phase1Time`: Number
*   `phase1Submitted`: Boolean
*   `phase1Qualified`: Boolean
*   `phase3Qualified`: Boolean

### `questions`
*   `phase`: Number (currently `1`)
*   `text`: String
*   `options`: Array[String] (exactly 4)
*   `correctIndex`: Number (0-3)
*   `difficulty`: String
*   `tags`: Array[String]

### `phase1sessions`
*   `status`: String (`idle`, `active`, `ended`)
*   `startedAt`: Date
*   `endedAt`: Date
*   `durationSeconds`: Number
