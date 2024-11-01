import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  
    


    
}
