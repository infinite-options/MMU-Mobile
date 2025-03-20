const apiUrl = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/userinfo";

export async function postUserData(formData) {
  try {
    const response = await fetch(apiUrl, {
      method: "PUT",
      body: formData,
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
}

export async function fetchUserInfo(user_uid) {
  try {
    console.log(`=== API DEBUG: Fetching user info for ${user_uid} ===`);
    const startTimeTotal = Date.now();

    const apiEndpoint = apiUrl + "/" + user_uid;
    // console.log(`API DEBUG: Calling endpoint: ${apiEndpoint}`);

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(apiEndpoint, {
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    // console.log(`API DEBUG: Received response for ${user_uid} in ${duration}ms`);

    if (!response.ok) {
      console.error(`API DEBUG: HTTP error! Status: ${response.status} for user ${user_uid}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTimeTotal;
    // console.log(`API DEBUG: Total time to fetch and parse data for ${user_uid}: ${totalDuration}ms`);

    if (!data.result || !data.result[0]) {
      console.error(`API DEBUG: No user data found for ${user_uid}`);
      throw new Error(`No user data found for ${user_uid}`);
    }

    // console.log(`API DEBUG: Successfully fetched data for ${user_uid}`);
    return data.result[0];
  } catch (error) {
    console.error(`API DEBUG: ⚠️ ERROR fetching userInfo for ${user_uid}:`, error);

    if (error.name === "AbortError") {
      console.error(`API DEBUG: ⚠️ TIMEOUT occurred while fetching user info for ${user_uid}`);
    }

    // Re-throw to allow calling code to handle the error
    throw error;
  }
}
