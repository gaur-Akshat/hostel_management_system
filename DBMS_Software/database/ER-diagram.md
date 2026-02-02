# Hostel Management – ER Diagram

Entity-relationship diagram for database **hostel_management**. View this file in VS Code (with a Mermaid extension), on GitHub, or at [mermaid.live](https://mermaid.live).

```mermaid
erDiagram
    HOSTEL ||--o{ ROOM : "has"
    HOSTEL ||--o{ STAFF : "employs"
    ROOM ||--o{ STUDENT : "accommodates"
    ROOM ||--o{ ROOM_ALLOCATION : "in"
    STUDENT ||--o{ ROOM_ALLOCATION : "has"
    STUDENT ||--o{ ATTENDANCE : "has"
    STUDENT ||--o{ FEES : "has"

    HOSTEL {
        int hostel_id PK
        varchar hostel_name
        varchar location
        int total_rooms
    }

    ROOM {
        int room_id PK
        varchar room_number
        varchar room_type
        int capacity
        varchar availability_status
        int hostel_id FK
        int current_occupancy
        enum status
    }

    STAFF {
        int staff_id PK
        varchar name
        varchar role
        varchar phone
        decimal salary
        int hostel_id FK
    }

    STUDENT {
        int student_id PK
        varchar name
        date dob
        varchar gender
        varchar phone
        varchar email
        varchar address
        varchar course
        int year
        int room_id FK
        varchar guardian_name
        varchar guardian_phone
    }

    ROOM_ALLOCATION {
        int allocation_id PK
        int student_id FK
        int room_id FK
        date allocation_date
    }

    ATTENDANCE {
        int attendance_id PK
        int student_id FK
        date date
        varchar status
    }

    FEES {
        int fee_id PK
        int student_id FK
        decimal amount
        date payment_date
        varchar payment_status
        enum fee_type
        varchar period
        enum status
    }

    USERS {
        int user_id PK
        varchar email
        varchar password
        enum role
        timestamp created_at
    }
```

## Relationship summary

| From | To | Cardinality | FK |
|------|-----|-------------|-----|
| hostel | room | 1 : N | room.hostel_id |
| hostel | staff | 1 : N | staff.hostel_id |
| room | student | 1 : N | student.room_id |
| room | room_allocation | 1 : N | room_allocation.room_id |
| student | room_allocation | 1 : N | room_allocation.student_id |
| student | attendance | 1 : N | attendance.student_id |
| student | fees | 1 : N | fees.student_id |

**users** has no foreign key in the schema; it is linked to student/staff in application logic by role.
