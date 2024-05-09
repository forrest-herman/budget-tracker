import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Button } from "./ui/button";

const SettingsModal = ({ isSettingsModalVisible, setIsSettingModalVisible }) => {
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50' onClick={() => setIsSettingModalVisible(!isSettingsModalVisible)}>
            <Popover placement='right'>
                <PopoverTrigger>
                    <Button>Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <div className='px-1 py-2'>
                        <div className='text-small font-bold'>Popover Content</div>
                        <div className='text-tiny'>This is the popover content</div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SettingsModal;
