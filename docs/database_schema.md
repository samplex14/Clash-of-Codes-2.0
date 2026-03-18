# Database Schema

## Participant

- id: Int
- usn: String (unique)
- name: String
- track: String
- phase1Score: Int
- qualified: Boolean
- isMapped: Boolean
- mappedTo: String?
- mappedAt: DateTime?
- submittedAt: DateTime?
- socketId: String?
- createdAt: DateTime
- updatedAt: DateTime

## Question

- id: Int
- questionText: String
- options: Json
- correctOptionId: String
- matchRound: Int?
- createdAt: DateTime

## Phase1Session

- id: Int
- status: String (idle, active, ended)
- startedAt: DateTime?
- endedAt: DateTime?
- createdAt: DateTime
