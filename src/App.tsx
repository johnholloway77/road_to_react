import styles from "./app.module.css";
import axios from "axios";
import clsx from "clsx";
import { type Story } from "./data.ts";
import React, { useState, useEffect, useRef, type JSX } from "react";

const API_ENDPOINT: string = "https://hn.algolia.com/api/v1/search?query=";

type Greeting = {
  greeting: string;
  title: string;
};

const welcome: Greeting = {
  greeting: "Hacker",
  title: "Stories",
};

type StoryData = { data: Story[]; isLoading: boolean; isError: boolean };

type hackNewsResponse = { hits: Story[] };

// type StoriesResponse = { data: { stories: Story[] } };

// function getAsyncStories() {
//   return new Promise(
//     (resolve) =>
//       setTimeout(() => resolve({ data: { stories: storyList } }), 2000),
//     //   //setTimeout(reject, 2000),
//   );
// }

type SiteAction =
  | { type: "FETCH_STORIES_INIT" }
  | { type: "FETCH_STORIES_SUCCESS"; payload: Story[] }
  | { type: "FETCH_STORIES_FAILURE" }
  | { type: "REMOVE_STORY"; payload: { objectID: Story["objectID"] } };

function storiesReducer(state: StoryData, action: SiteAction): StoryData {
  switch (action.type) {
    case "FETCH_STORIES_INIT": {
      return { ...state, isError: false, isLoading: true };
    }
    case "FETCH_STORIES_SUCCESS": {
      return { data: action.payload, isError: false, isLoading: false };
    }
    case "FETCH_STORIES_FAILURE": {
      return { data: [], isError: true, isLoading: false };
    }
    case "REMOVE_STORY": {
      return {
        data: state.data.filter(
          (story) => action.payload.objectID != story.objectID,
        ),
        isError: false,
        isLoading: false,
      };
    }
    default: {
      return state;
    }
  }
}

type ItemProps = Story & {
  onRemove: () => void;
};

function Item({
  url,
  title,
  author,
  num_comment,
  points,
  onRemove,
}: ItemProps) {
  return (
    <li className={styles.item}>
      <span style={{ width: "40%" }}>
        <a href={url}>{title}</a>
      </span>
      <span>&nbsp;</span>
      <span style={{ width: "30%" }}>{author}</span>
      <span>&nbsp;</span>
      <span style={{ width: "10%" }}>{num_comment}</span>
      <span>&nbsp;</span>
      <span style={{ width: "10%" }}>{points}</span>
      <span>&nbsp;</span>
      <span style={{ width: "10%" }}>
        <button
          type="button"
          onClick={onRemove}
          className={clsx(styles.button, styles.buttonLarge)}
        >
          Remove
        </button>
      </span>
    </li>
  );
}

const title: JSX.Element = (
  <h1 className={styles.headlinePrimary}>
    {welcome.greeting} {welcome.title}
  </h1>
);

type searchFormProps = {
  searchAction: () => void;
  onSearchInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchTerm: string;
};
function SearchForm({
  searchAction,
  onSearchInput,
  searchTerm,
}: searchFormProps) {
  return (
    <form action={searchAction} className={styles.searchForm}>
      <InputWithLabel
        id="search"
        onChange={onSearchInput}
        value={searchTerm}
        isFocused={true}
      >
        <strong>Search: </strong>
      </InputWithLabel>
      <button
        type="submit"
        disabled={!searchTerm}
        className={`${styles.button} ${styles.buttonLarge}`}
      >
        Search
      </button>
      <hr />
    </form>
  );
}

type ListProps = {
  list: Story[];
  searchValue: string;
  onRemoveSite: (story: Story) => void;
};

function List({ list, onRemoveSite }: ListProps): JSX.Element {
  return (
    <div>
      <ul>
        {list
          // .filter((story: Story) =>
          //   story.title.toLowerCase().includes(searchValue.toLowerCase()),
          // )
          .map(
            (item): JSX.Element => (
              <Item
                key={item.objectID}
                {...item}
                onRemove={() => onRemoveSite(item)}
              />
            ),
          )}
      </ul>
    </div>
  );
}

function useStorageState(key: string, initialState: string) {
  const [value, setValue] = useState(
    () => localStorage.getItem(key) ?? initialState,
  );

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

type inputWithLabelProps = {
  id: string;
  label?: string;
  type?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  children?: JSX.Element | string;
  isFocused?: boolean;
};

function InputWithLabel({
  id,
  label,
  type = "text",
  onChange,
  value,
  children,
  isFocused = false,
}: inputWithLabelProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect((): void => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      <label htmlFor={id} className={styles.label}>
        {label ? label : children}{" "}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        autoFocus={isFocused}
        onChange={onChange}
        className={styles.input}
      />
    </>
  );
}

function App(): JSX.Element {
  const [stories2, dispatchStories] = React.useReducer(storiesReducer, {
    data: [],
    isLoading: false,
    isError: false,
  });

  const [searchTerm, setSearchTerm] = useStorageState(
    "search",
    localStorage.getItem("search") || "React",
  );

  const [url, setUrl] = useState<string>(API_ENDPOINT + searchTerm);

  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: "FETCH_STORIES_INIT" });

    try {
      const result = await axios.get<hackNewsResponse>(url);

      dispatchStories({
        type: "FETCH_STORIES_SUCCESS",
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: "FETCH_STORIES_FAILURE" });
    }
  }, [url]);

  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  function handleRemoveSite(story: Story): void {
    dispatchStories({
      type: "REMOVE_STORY",
      payload: { objectID: story.objectID },
    });
  }

  function handleSearchInput(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  function searchAction() {
    // event.preventDefault();
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  }

  return (
    <div className={styles.container}>
      {title}

      <SearchForm
        searchAction={searchAction}
        onSearchInput={handleSearchInput}
        searchTerm={searchTerm}
      />

      {stories2.isError ? (
        <p>
          Error: Something went wrong
          <br /> Unable to fetch Stories
        </p>
      ) : stories2.isLoading ? (
        <p>loading...</p>
      ) : (
        <List
          list={stories2.data}
          searchValue={searchTerm}
          onRemoveSite={handleRemoveSite}
        />
      )}
    </div>
  );
}

export default App;
