const apiUrl = 'https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo';


export async function postUserData(formData){
  
    try {
          
            const response = await fetch(apiUrl, {
            method: 'PUT',
            body: formData 
            });
            if (!response.ok) {
                const statusCode = response.status;
                const errorText = await response.text();
          //      console.log(response);
            }
            const result = await response.json();
           // console.log('Success: ' + JSON.stringify(result));
    } catch (error) {
           // console.log('Error--: ' + error.message);
    } 
};

export async function fetchUserInfo(user_uid) {
    try {

      const response = await fetch(apiUrl + '/' + user_uid);
      console.log(apiUrl+'/'+user_uid)
      if (!response.ok) {
       // console.log('Response status:', response.status);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      //console.log('data.result[0]',data.result[0]);
      console.log("TESTINGGG",data.result[0])
      return data.result[0];
        
    } catch (error) {
        console.error('Error fetching userInfo:', error); 
    } 
  }; 