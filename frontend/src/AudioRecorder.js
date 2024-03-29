import { useState, useRef } from "react";
import {Button, Row, Col} from "react-bootstrap";
import axios from "axios";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'bootstrap/dist/css/bootstrap.min.css';
import play from "./play.png";
import pause from "./pause.png";
import next from "./next.png";
import {textButton, iconButton} from "./styles";
import {serverUrl} from "./urls";



const AudioRecorder = ({returnFeedback}) => {
    const {transcript, listening} = useSpeechRecognition();
    const [feedbackButtonDisabled, setFeedbackButton] = useState(false);
    const mimeType = "audio/webm";
    const [permission, setPermission] = useState(false);
    const mediaRecorder = useRef(null);
    const [recordingStatus, setRecordingStatus] = useState("inactive");
    const [stream, setStream] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audio, setAudio] = useState(null);

    const getMicrophonePermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                setPermission(true);
                setStream(streamData);
            } catch (err) {
                alert(err.message);
            }
        } else {
            alert("The MediaRecorder API is not supported in your browser.");
        }
    };
    const startRecording = async () => {
        setRecordingStatus("recording");
        //create new Media recorder instance using the stream
        const media = new MediaRecorder(stream, { type: mimeType });
        //set the MediaRecorder instance to the mediaRecorder ref
        mediaRecorder.current = media;
        //invokes the start method to start the recording process
        mediaRecorder.current.start();
        let localAudioChunks = [];
        mediaRecorder.current.ondataavailable = (event) => {
            if (typeof event.data === "undefined") return;
            if (event.data.size === 0) return;
            localAudioChunks.push(event.data);
        };
        setAudioChunks(localAudioChunks);
    };
    const stopRecording = () => {
        // eslint-disable-next-line no-unused-expressions
        SpeechRecognition.stopListening;
        setRecordingStatus("inactive");
        //stops the recording instance
        mediaRecorder.current.stop();
        mediaRecorder.current.onstop = () => {
            //creates a blob file from the audiochunks data
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            //creates a playable URL from the blob file.
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudio(audioUrl);
            setAudioChunks([]);
        };
    };
    function listenContinously() {
        SpeechRecognition.startListening({
            continuous: true
        })
    }

    function sendRecordingData() {
        console.log(transcript);
        setFeedbackButton(true);
        const postData = {audioData: transcript};
//        const postData = {audioData: "I would write myself a hard worker and that's why do it myself at 1:00 because I'm so he really likes to try and push the challenges and overcome difficulties"};

        axios({
            url: serverUrl + "audiomessage",
            method: "POST",
            data: postData,
        })
            .then((res) => {
                console.log(res.data);
                returnFeedback(res.data);
            })
            .catch((err) => {});
    }



    return (
        <div>
            <div className="audio-controls">
                <div style={{ marginTop: '5px' }}>
                    {!permission ? (
                        <Button onClick={getMicrophonePermission} style={textButton}>
                            Enable Microphone
                        </Button>
                    ) : null}
                </div>
                <div style={{ marginTop: '5px' }}>
                    {permission && recordingStatus === "inactive" ? (
                        <Button onClick={() => {
                            startRecording();
                            listenContinously();
                        }} style={iconButton}>
                            <img src={play} alt="play" style={{height: '25px', marginLeft: '-5px'}}/>
                        </Button>
                    ) : null}
                    {recordingStatus === "recording" ? (
                        <Button onClick={() => {
                            stopRecording();
                            SpeechRecognition.stopListening();
                        }} style={iconButton}>
                            <img src={pause} alt="pause" style={{height: '25px', marginLeft: '-5px'}}/>
                        </Button>
                    ) : null}
                </div>
                <div style={{ marginTop: '5px' }}>
                    {audio ? (
                        <div className="audio-container">
                            <Button onClick={sendRecordingData} style={textButton} disabled={feedbackButtonDisabled}>
                                Get Feedback
                            </Button>
                        </div>
                    ) : null}
                </div>
                <div style={{ marginTop: '5px' }}>
                    {audio ? (
                        <div className="audio-container">
                            <audio src={audio} controls></audio>
                            <br/>
                            <Button href={audio} target={'_blank'} style={textButton}>Download Recording</Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
export default AudioRecorder;