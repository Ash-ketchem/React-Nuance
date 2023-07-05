# React-Nuance

An expermimental simple small state management solution for react inspired from zustand

version 3

# Installation

```bash
npm i react-nuance
```

## Create a store and set functions

```jsx
import { create } from "react-nuance";

const userStore = create((set) => ({
  user: {
    name: "ash",
    age: 10,
  },

  setUserName: (name) => {
    set((state) => {
      return {
        user: {
          ...state.user,
          name: name,
        },
      };
    });
  },
}));
```

## use the store and functions react hooks style

accessing the store in this way will only cause renders on state changes

```jsx
const user = userStore((state) => state.user);
const setUserName = userStore((state) => state.setUserName);
```

## use the store without causing re-renders

this will provide the store and a set function but updating the store won't cause any re-render

```jsx
const [store, setStore] = userStore();
```

## fine-grained reactivity using keys

you can provide keys to control how re-render occurs on changes to store

# A general example would be

```jsx
import { create } from "react-nuance";

const catStore = create((set) => ({
  cat: {
    name: "pussy",
    eats: "food",
  },

  setCatName: (name, key) => {
    set((state) => {
      return {
        cat: {
          ...state.cat,
          name: name,
        },
      };
    }, key); // a key is given to filter callbacks to deicide if a re-render is required or not
}));

const catName = catStore((state) => state.cat.name, "mykey"); // mykey is the key name used to derive the atomic cat name state

const setCatName = catStore((state) => state.setCatName);

setCatName("rose", "mykey"); // setCatName is called with myKey as key

// keys can be an array too
setCatName("rose", ["mykey", "mykey2"]);
```

# example with a page showing posts

```jsx
import { create } from "react-nuance";

const postStore = create((set) => ({
  posts: [
    { id: 1, body: "post 1", liked: "true" },
    { id: 2, body: "post 2", liked: "fasle" },
    { id: 3, body: "post 3", liked: "true" },
    { id: 4, body: "post 4", liked: "fasle" },
  ],

  setPost: (post) => {
    set((state) => {
      return {
        posts: [...state.posts, post],
      };
    });
  },

  setLike: (id) => {
    set((state) => {
      return {
        posts: state.posts.map((post) =>
          post.id === id ? { ...post, liked: !post.liked } : post
        ),
      };
    }, id);
    // here id is the key given to set function to specifically tell which atomic state should be re-renderd on state derived with the same key
  },
}));
```

The atomic states can be derived as shown below
use the same keys for selector function and set functions in store

```jsx
const id = 1;
const post = postStore(
  (state) => state.posts.find((post) => post.id === id),
  id // id is the key given while deriving the atomic state
);
const setLike = postStore((state) => state.setLike);

setLike(id);
```

## when to use keys with state updates

keys can be used when you want to update a part of the store data but don't want to cause re-render to all other components which uses the store.

with keys you can control re-renders and the store will be up-to-date even if the ui doesn't reflect the changes

## example

# postStore.js

```jsx
import { create } from "react-nuance";

const postStore = create((set) => ({
  posts: [
    { id: 1, body: "post 1", liked: "true" },
    { id: 2, body: "post 2", liked: "fasle" },
    { id: 3, body: "post 3", liked: "true" },
    { id: 4, body: "post 4", liked: "fasle" },
  ],

  setPost: (post) => {
    set((state) => {
      return {
        posts: [...state.posts, post],
      };
    });
  },

  setLike: (id) => {
    set((state) => {
      return {
        posts: state.posts.map((post) =>
          post.id === id ? { ...post, liked: !post.liked } : post
        ),
      };
    }, id); //set function is called with unique keys related to posts
  },
}));

export default postStore;
```

# Posts.jsx

```jsx
"use client";

import { useState } from "react";
import PostItem from "./PostItem";
import postStore from "./postStore";

const Posts = () => {
  const posts = postStore((state) => state.posts);
  const setPost = postStore((state) => state.setPost);

  const [state, setState] = useState(true);

  console.log(posts);

  const handleAddPost = () => {
    const key = Math.random();
    const post = {
      id: key,
      body: `post - ${key}`,
      liked: false,
    };
    console.log(post);
    setPost(post);
  };
  return (
    <>
      <h3>posts</h3>

      {posts.map((post) => (
        <PostItem id={post?.id} key={post?.id} />
      ))}
      <button onClick={handleAddPost}>add post</button>

      <button onClick={() => setState((state) => !state)}>toggle</button>
    </>
  );
};

export default Posts;
```

# PostItem.jsx

```jsx
import postStore from "./postStore";

const PostItem = ({ id }) => {
  const post = postStore(
    (state) => state.posts.find((post) => post.id === id),
    id
  );
  // atomic store is derived giving a unique id as key
  // this key will be used to control re-renders during setLike calls

  const setLike = postStore((state) => state.setLike);

  const handleLike = () => {
    setLike(id);
  };

  return (
    <>
      <div>
        <p>{post.body}</p>
        <button onClick={handleLike}>{post.liked ? "unlike" : "like"}</button>
      </div>
    </>
  );
};

export default PostItem;
```

## SHARING STATE

From version 3.0 you can share the state between components using the same key for both states

```jsx
const component1 = () => {
  const key = "myKey";
  const username = someStore((state) => state.user.name, key);

  return <></>;
};

const component2 = () => {
  const key = "myKey";
  const username = someStore((state) => state.user.name, key);

  return <></>;
};
```

These two componenets will share the same state as same key is used to select the state from the store

## GROUPING STATES

From version 3.0 states can be grouped using an array of keys

```jsx
const GroupReactivity = () => {
  const groupKey = "user_name";
  const prefixes = ["01_", "02_"];
  const keySet = prefixes.map((prefix) => prefix + groupKey);

  return (
    <div>
      {prefixes.map((prefix) => (
        <GroupStateShareComponent
          keySet={keySet}
          key={prefix + groupKey}
          Key={prefix + groupKey} //unique key for each component
        />
      ))}
    </div>
  );
};
```

An array of keys is used here for state update on multiple components

```jsx
const GroupStateShareComponent = ({ keySet, Key }) => {
  const userName = someStore((state) => state.user.name, Key);
  const setUserName = someStore((state) => state.setUserName);

  return (
    <div>
      <div>
        <h4>{userName}</h4>
        <button
          onClick={() => {
            setUserName(userName === "ash" ? "sam" : "ash", keySet);
            // set function is called with an array of keys instead of a single key
          }}
        >
          change name
        </button>
      </div>
    </div>
  );
};
```

## changes from v3.0

- setter functions are not stored in subscribers list
- existing state can be shared
- Groups of state can be created

## WHAT NOT TO DO

- KEYS ARE NOT REQUIRED FOR SETTER FUNCTIONS IN THE STORE BECAUSE THERE IS NO NEED TO TRACK THEM

* TRYING TO RETURN AN ARRAY/OBJECT OF DERIVED STATES FROM THE SELECTOR FUNCTION OF THE STORE WILL RESULT IN INFINTRE RE-RENDER

## For more examples check the github repo

https://github.com/Ash-ketchem/React-nuance-examples
