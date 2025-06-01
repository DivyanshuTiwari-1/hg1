# Property Listing Application

A Next.js TypeScript application for managing property listings with features like CRUD operations, advanced filtering, user authentication, and property favorites.

## Features

- User authentication (register/login)
- CRUD operations for properties
- Advanced property search and filtering
- Property favorites system
- Redis caching for better performance
- MongoDB database integration
- TypeScript support
- Responsive design


### 1. **Register User**
```http
POST http://hg1.vercel.app/api/auth/register
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
}
```

### 2. **Login User**
```http
POST http://hg1.vercel.app/api/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "password123"
}
```
*Save the returned token for subsequent requests*

### 3. **Get All Properties**
```http
GET http://hg1.vercel.app/api/properties
Authorization: Bearer <your_token>
```

### 4. **Get Properties with Filters**
```http
GET http://hg1.vercel.app/api/properties?type=apartment&minPrice=1000&maxPrice=2000&bedrooms=2&city=New%20York
Authorization: Bearer <your_token>
```

### 5. **Create Property**
```http
POST http://hg1.vercel.app/api/properties
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "title": "Luxury Apartment",
    "type": "apartment",
    "price": 1500,
    "state": "NY",
    "city": "New York",
    "areaSqFt": 1000,
    "bedrooms": 2,
    "bathrooms": 2,
    "amenities": ["parking", "gym"],
    "furnished": true,
    "availableFrom": "2024-03-01",
    "listedBy": "John Doe",
    "tags": ["luxury", "downtown"],
    "colorTheme": "modern",
    "rating": 4.5,
    "isVerified": true,
    "listingType": "rent"
}
```

### 6. **Get Single Property**
```http
GET http://hg1.vercel.app/api/properties/<property_id>
Authorization: Bearer <your_token>
```

### 7. **Update Property**
```http
PUT http://hg1.vercel.app/api/properties/<property_id>
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "price": 1600,
    "amenities": ["parking", "gym", "pool"]
}
```

### 8. **Delete Property**
```http
DELETE http://hg1.vercel.app/api/properties/<property_id>
Authorization: Bearer <your_token>
```

### 9. **Send Property Recommendation**
```http
POST http://hg1.vercel.app/api/recommendations/send
Authorization: Bearer <your_token>
Content-Type: application/json
{
    "propertyId": "PROP1003",
    "recipientEmail": "recipient@example.com",
    "message": "Check out this amazing property!"
}

```

### 10. **Get Received Recommendations**
```http
GET http://hg1.vercel.app/api/recommendations/received
Authorization: Bearer <your_token>
```

### 11. **Add to Favorites**
```http
POST http://hg1.vercel.app/api/favorites
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "propertyId": "<property_id>"
}
```

### 12. **Get Favorites**
```http
GET http://hg1.vercel.app/api/favorites
Authorization: Bearer <your_token>
```

### 13. **Remove from Favorites**
```http
DELETE http://hg1.vercel.app/api/favorites
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "propertyId": "<property_id>"
}
```

### Testing Tips:
1. Replace `<your_token>` with the JWT token received from login
2. Replace `<property_id>` with actual property IDs from your database
3. Test the error cases by:
   - Using invalid tokens
   - Sending invalid data
   - Trying to modify properties you don't own
   - Using non-existent property IDs

