const SERVER_URL = 'http://localhost:3001/api/';

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          response.json()
            .then(obj => 
              reject(obj)
              ) 
            .catch(err => reject({ error: "Cannot parse server response" })) 
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) 
  });
}

const getModels = async () => {
  return getJson(
      fetch(SERVER_URL + 'models')
  ).then( json => {
    return json.map((model) => {
      const carModel = {
        id: model.id,
        name: model.name,
        engine: model.engPowerKW,
        cost: model.costEuros,
        maxNumAccessories: model.maxNumAccessories
      }
      return carModel;
    })
  }).catch(err => 
    reject({ error: "Error"  }))
}

const getAccessories = async () => {
  return getJson(
      fetch(SERVER_URL + 'accessories')
  ).then( json => {
    return json.map((acc) => {
      const accessory = {
        id: acc.id,
        name: acc.name,
        price: acc.priceEur,
        availability: acc.availability
      }
      return accessory;
    })
  }).catch(err => 
    reject({ error: "Error"  }))
}

const getAccessoriesWithConstraints = async () => {
   return getJson(
    fetch(SERVER_URL + 'accessories-with-constraints',{
      method:'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
    }})
).then( json => {
  return json.map((acc) => {
    const accessory = {
      id: acc.id,
      name: acc.name,
      price: acc.priceEur,
      availability: acc.availability,
      requiredAccessoryId: acc.requiredAccessoryId,
      requiredAccessoryName: acc.requiredAccessoryName,
      incompatibleAccessoryId: acc.incompatibleAccessoryId,
      incompatibleAccessoryName: acc.incompatibleAccessoryName 
      }
    return accessory;
  })
}).catch(err => 
  reject({ error: "Error"  }))
}

const getConfigurationById = async (userId) => {
  try {
    const response = await fetch(`${SERVER_URL}user/config/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Network response failed");
    }

    const json = await response.json();
    const config = {
      userId: json.userId,
      carModelId: json.carModelId,
      accessoryIds: json.accessoryIds,
    };

    return config;
  } catch (error) {
    return Promise.reject({ error: "Error" });
  }
};

const saveNewConfig = async (userId, carModelId, accessories) => {
  const configData = {
    carModelId: carModelId,
    accessories: accessories
  }
  try {
    const response = await fetch(`${SERVER_URL}user/config/${userId}`, {
      method: 'POST',
      credentials: 'include',
      headers:{
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });
    if (!response.ok){
      throw new Error(`Error: ${response.status}`)
    }
    const result = await response.json();
    return result;
  } catch (err){
    throw new Error('Error saving new configuration');
  }
}

const updateConfig = async (userId, carModelId, accessories) => {
  const configData = {
    carModelId: carModelId,
    accessories: accessories
  }
  try {
    const response = await fetch(`${SERVER_URL}user/config/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers:{
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });
    if (!response.ok){
      throw new Error(`Error: ${response.status}`)
    }
    const result = await response.json();
    return result;
  } catch (err){
    throw new Error('Error updating configuration');
  }
}

const deleteConfig = async (userId) => {
  try {
    const response = await fetch(`${SERVER_URL}user/config/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (err) {
    throw new Error('Error deleting configuration');
  }
}

async function getEstimation(authToken, accessories) {
  return getJson(fetch('http://localhost:3002/api/' + 'estimation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({accessories: accessories}),
  })
  );
}

const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', 
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    credentials: 'include'
  })
  )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  })
  )
}




async function getAuthToken() {
  return getJson(fetch(SERVER_URL + 'auth-token', {
    credentials: 'include'
  })
  )
}

  const API = { getModels, getAccessories, getAccessoriesWithConstraints, getConfigurationById, saveNewConfig, updateConfig, deleteConfig, logIn, getUserInfo, logOut,
    getAuthToken, getEstimation };
    
export default API;