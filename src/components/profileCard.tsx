import {observer} from "mobx-react-lite";
import {useStore} from "../store";


const ProfileCard = observer(() => {
    const { UserStore } = useStore();
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0d1117',
            padding: '20px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            width: 'fit-content',
            textAlign: 'left'
        }}>
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    marginRight: '16px',
                    border: '1px solid #30363d',
                    backgroundColor: 'white'
                }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    Zhao Wenrong <span style={{ color: '#8b949e', fontWeight: '400' }}>(Momoyouta)</span>
                </div>
                <div style={{ color: '#8b949e', fontSize: '14px', marginTop: '4px' }}>
                    Your personal account
                    {UserStore.count}
                </div>
            </div>
        </div>
    )
})

export default ProfileCard;