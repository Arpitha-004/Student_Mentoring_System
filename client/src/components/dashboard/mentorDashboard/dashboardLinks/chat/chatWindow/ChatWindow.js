import React from "react";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { createMessage, getMessages } from "../../../../../../actions/chat";

const ChatWindow = ({ selectedChat }) => {
    const dispatch = useDispatch();
    const history = useHistory();

    // api call to fetch all the messages for the selected chat
    useEffect(() => {
        if (selectedChat) {
            // console.log("selectedChat", selectedChat);
            dispatch(getMessages(history, selectedChat));
        }
    }, [dispatch, selectedChat, history]);

    // state for custom placeholder in the input div
    const [placeHol, setPlaceHol] = useState("opacity-100");
    // state to set the disable status of the send button
    const [disable, setDisable] = useState(true);

    // state variable representing the message to be sent
    const [message, setMessage] = useState({
        content: "",
        chat: "",
    });

    // div seletor for the div used as text input
    var contenteditable = document.querySelector("[contenteditable]");

    // function to send the text message
    const sendMessage = () => {
        dispatch(createMessage(history, message));
        contenteditable.innerHTML = "";
        contenteditable.focus();
        check();
    };

    // function for hiding the custom placeholder
    const focusPlaceHol = () => {
        setPlaceHol("opacity-0");
    };

    // function for showing the custom placeholder
    const blurPlaceHol = () => {
        if (contenteditable.innerHTML === "" || contenteditable.innerHTML === "<br>") {
            setPlaceHol("opacity-100");
        }
    };

    /* function to check if the custom input div is empty or not to control the send button disable status */
    const check = () => {
        // console.log("running");
        // console.log(contenteditable.innerHTML);
        if (contenteditable.textContent.trim() === "") {
            setDisable(true);
        } else {
            setDisable(false);
        }
        setMessage({
            content: contenteditable.textContent.trim(),
            chat: selectedChat,
        });
    };

    console.log("message", message);

    return (
        <>
            <div className="w-3/5 mt-5 p-2 bg-white rounded-md h-full overflow-auto">
                <div className="w-full h-9/10 overflow-auto">{/* messages */}</div>
                <div className="w-full h-1/10">
                    <div className="flex items-center justify-center h-full gap-x-6">
                        <div className="w-3/5 relative">
                            <div
                                onFocus={focusPlaceHol}
                                onBlur={blurPlaceHol}
                                onKeyUp={check}
                                contentEditable={true}
                                className="px-2 py-3 rounded-md max-h-16 bg-gray-100 outline-none break-words overflow-auto"
                            ></div>
                            <h4
                                className={`text-gray-400 opa absolute top-3 left-2 pointer-events-none ${placeHol}`}
                            >
                                Type something...
                            </h4>
                        </div>

                        <button
                            title="Send message"
                            className={`bg-green-500 p-2.5 rounded-md disabled:opacity-50 text-white`}
                            onClick={sendMessage}
                            disabled={disable}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatWindow;
