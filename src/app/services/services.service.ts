import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private apiUrl = 'http://localhost:3000/api/services';

  constructor(private http: HttpClient) {}

  // Fetch services where productCategory is "Accommodation"
  getAccommodationServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${'accommodation'}`);
  }


  // Fetch a specific service by ID
  getAccommodationServiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

    // Fetch all restaurants
    getRestaurants(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/restaurants`);
    }
  
    // Fetch restaurant by ID
    getRestaurantById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/restaurant/${id}`);
    }

    publishAccommodation(accommodationData: FormData): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/accommodations`, accommodationData);
    }


    getAccommodationDetailsById(serviceId: string) {
      return this.http.get<any>(`http://localhost:3000/api/accommodation/service/${serviceId}`);
    }

    updateRoomType(accommodationId: string, roomType: any): Observable<any> {
      const formData = new FormData();
    
      // Append room type data to FormData
      formData.append('_id', roomType._id);
      formData.append('name', roomType.name);
      formData.append('price', roomType.price.toString());
    
      // Append amenities, images, and rooms
      roomType.amenities.forEach((amenity: string) => formData.append('amenities', amenity));
      // Append rooms as a single JSON string
      formData.append('rooms', JSON.stringify(roomType.rooms));

        // Log images before appending them to FormData
      console.log('Images to be uploaded:', roomType.uploadImages);
  
    
      // Append only the converted File objects or paths for uploading
      // roomType.uploadImages.forEach((image: any) => {

      //   console.log('Processing image for upload:', image);
      //   if (image instanceof File) {
      //     formData.append('images', image);
      //   } else {
      //     formData.append('images', image); // For existing image paths
      //   }
      // });

        // Append only the converted File objects or paths for uploading
  roomType.uploadImages.forEach((image: any) => {
    // Log the image being processed
    console.log('Processing image for upload:', image);

    // Append both File objects and existing image paths to FormData
    formData.append('images', image);
  });
    
      return this.http.put(`${this.apiUrl}/accommodations/${accommodationId}/roomtype`, formData);
    }

    deleteRoomType(accommodationId: string, roomTypeId: string): Observable<any> {
      return this.http.delete<any>(`${this.apiUrl}/accommodations/${accommodationId}/room-types/${roomTypeId}`);
    }

  // Update accommodation service by ID
  updateAccommodationService(id: string, accommodation: any): Observable<any> {
    console.log('Updating accommodation with ID:', id); // Log the ID of the accommodation being updated
    console.log('Accommodation data:', accommodation); // Log the accommodation data being sent
  
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, accommodation);
  }

  getAccommodationDataById(serviceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accommodations/service/${serviceId}`);
  }

  getAvailableRoom(roomTypeId: string, checkInDate: string, checkOutDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rooms/available/${roomTypeId}`, {
      params: { checkInDate, checkOutDate }
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        return throwError(error);
      })
    );
  }
  


  
  // Update accommodation service by ID
  updateRestaurantService(id: string, accommodation: any): Observable<any> {
    console.log('Updating accommodation with ID:', id); // Log the ID of the accommodation being updated
    console.log('Accommodation data:', accommodation); // Log the accommodation data being sent
  
    return this.http.put<any>(`${this.apiUrl}/update/restaurant/${id}`, accommodation);
  }

  uploadMenu(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-menu`, formData).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError('Something went wrong. Please try again later.');
  }

    // Method to fetch the restaurant menu
    getRestaurantMenu(serviceId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/restaurantMenu/${serviceId}`).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error in getRestaurantMenu:', error);
          return throwError(() => new Error(error.message));
        })
      );
    }

    updateRoomStatus(accommodationId: string, roomType: any) {
      return this.http.put(`${this.apiUrl}/${accommodationId}/roomType`, roomType);
    }

    updateSelectedRoomStatus(accommodationId: string, roomTypeId: string, roomId: string, status: string, isLocked: boolean, lockReason: string): Observable<any> {
      const url = `${this.apiUrl}/${accommodationId}/room-types/${roomTypeId}/rooms/${roomId}/status`;
      return this.http.put(url, { status, isLocked, lockReason });
    }
    
    
  
  
    


    
  getTourGuideServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${'tour-guide'}`);
  }

  getTourGuideServiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Add this method in your existing ServicesService

  deleteTourGuideService(serviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${serviceId}`);
  }

  
  updateTourGuideService(id: string, tourGuide: any): Observable<any> {

    return this.http.put<any>(`${this.apiUrl}/update/tourGuide/${id}`, tourGuide);
  }

  // GET booking
  getUserBookings(userId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/bookings/user/${userId}`);
  }

updatePaymentStatus(bookingId: string, bookingType: string): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/payments/update-status', { bookingId, bookingType });
}

createTransaction(bookingId: string, amount: number, userId: string): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/create-transaction', {
      bookingId,
      amount,
      userId,
  });
}

getServiceRating(serviceId: string): Observable<{ averageRating: number, reviewCount: number }> {
  return this.http.get<{ averageRating: number, reviewCount: number }>(`${this.apiUrl}/${serviceId}/rating`);
}

// Check if a room type has active bookings
checkRoomTypeActiveBookings(roomTypeId: string): Observable<{ hasActiveBookings: boolean }> {
  return this.http.get<{ hasActiveBookings: boolean }>(
    `${this.apiUrl}/bookings/roomType/${roomTypeId}/hasActiveBookings`
  );
}

checkRoomActiveBookings(roomId: string): Observable<{ hasActiveBookings: boolean }> {
  return this.http.get<{ hasActiveBookings: boolean }>(
    `${this.apiUrl}/bookings/room/${roomId}/hasActiveBookings`
  );
}


deleteRoom(accommodationId: string, roomTypeId: string, roomId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${accommodationId}/roomType/${roomTypeId}/room/${roomId}`);
}




}
